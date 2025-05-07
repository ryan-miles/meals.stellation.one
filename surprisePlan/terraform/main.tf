# --- IAM Role for Lambda ---
data "aws_iam_policy_document" "lambda_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name               = "${var.function_name}-exec-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy.json
  tags               = var.project_tags
}

# --- IAM Policy for Lambda Permissions ---
data "aws_iam_policy_document" "lambda_permissions_policy" {
  # Permission for CloudWatch Logs
  statement {
    sid = "AllowCloudWatchLogs"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.function_name}:*"]
  }

  # Permission to List Objects in the recipes prefix
  statement {
    sid = "AllowS3ListRecipes"
    actions = [
      "s3:ListBucket",
    ]
    resources = ["arn:aws:s3:::${var.s3_bucket_name}"]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${var.s3_recipes_prefix}*"]
    }
  }

   # Permission to Put the schedule.json object
  statement {
    sid = "AllowS3PutSchedule"
    actions = [
      "s3:PutObject",
    ]
    resources = ["arn:aws:s3:::${var.s3_bucket_name}/${var.s3_schedule_key}"]
  }
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "${var.function_name}-permissions-policy"
  role   = aws_iam_role.lambda_exec_role.id
  policy = data.aws_iam_policy_document.lambda_permissions_policy.json
}

# --- Get AWS Account ID (needed for policy ARN) ---
data "aws_caller_identity" "current" {}

# --- Lambda Function ---
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda_code/"
  output_path = "${path.module}/lambda_deployment_package.zip"

  excludes = [
    ".git*",
    "*.tf",
    "*.bat",
    "test-G-API.ps1"
  ]
}

resource "aws_lambda_function" "surprise_planner" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec_role.arn

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment {
    variables = {
      S3_BUCKET_NAME   = var.s3_bucket_name
      S3_RECIPES_PREFIX = var.s3_recipes_prefix
      S3_SCHEDULE_KEY  = var.s3_schedule_key
    }
  }

  tags = var.project_tags

  depends_on = [data.archive_file.lambda_zip]
}

# --- API Gateway v2 (HTTP API) ---

resource "aws_apigatewayv2_api" "surprise_api" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "API Gateway for surprise-plan-lambda"

  cors_configuration {
    allow_origins = ["https://meals.stellation.one"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 300
  }

  tags = var.project_tags
}

# --- API Gateway Integration ---
# Connects the API Gateway to the Lambda function

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.surprise_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.surprise_planner.invoke_arn
  payload_format_version = "2.0"
}

# --- API Gateway Route ---
# Defines the specific path and method that triggers the integration

resource "aws_apigatewayv2_route" "get_route" {
  api_id    = aws_apigatewayv2_api.surprise_api.id
  route_key = "GET /generate-surprise-plan"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# --- API Gateway Stage ---
# Creates a deployment stage (e.g., 'prod') for the API

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id = aws_apigatewayv2_api.surprise_api.id
  name   = "$default"

  auto_deploy = true

  tags = var.project_tags
}

# --- Lambda Permission ---
# Grants API Gateway permission to invoke the Lambda function

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.surprise_planner.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.surprise_api.execution_arn}/*/*"
}

# --- EventBridge Rule for Scheduled Lambda Trigger ---
resource "aws_cloudwatch_event_rule" "weekly_surprise_plan" {
  name                = "${var.function_name}-weekly-trigger"
  description         = "Trigger Lambda every Saturday night at 12:01 AM"
  schedule_expression = "cron(1 0 ? * SUN *)" # 12:01 AM Sunday UTC (which is Saturday 8:01 PM EST)
  tags                = var.project_tags
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.weekly_surprise_plan.name
  target_id = "surprisePlanLambdaTarget"
  arn       = aws_lambda_function.surprise_planner.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.surprise_planner.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_surprise_plan.arn
}

# --- Output the API Endpoint URL ---
# Makes it easy to find the URL after deployment

output "api_endpoint_url" {
  description = "The invocation URL for the API Gateway stage (GET /generate-surprise-plan)"
  value       = "${aws_apigatewayv2_stage.default_stage.invoke_url}/generate-surprise-plan"
}