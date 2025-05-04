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
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"] # Allow creating/writing to any log group/stream
  }

  # Permission to get the Gemini API Key secret
  statement {
    actions = [
      "secretsmanager:GetSecretValue",
    ]
    # Construct the ARN for the specific secret, ensuring leading / is present
    resources = ["arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.gemini_secret_name}*"]
    # Note: Assumes secret name format like /path/to/secret. Adjust if using full ARN in var.gemini_secret_name.
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
  # Point to the parent directory containing lambda_code/
  source_dir  = "${path.module}/../lambda_code/"
  output_path = "${path.module}/lambda_deployment_package.zip"

  # Exclude unnecessary files from the zip
  excludes = [
    ".git*",
    "*.tf",
  ]
}

resource "aws_lambda_function" "gemini_generator" {
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec_role.arn

  # Deployment package from the archive file
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # Configuration
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  # Environment variables needed by the Lambda code
  environment {
    variables = {
      GEMINI_API_KEY_SECRET_NAME = var.gemini_secret_name
    }
  }

  tags = var.project_tags
}

# --- API Gateway v2 (HTTP API) ---

resource "aws_apigatewayv2_api" "gemini_api" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = "API Gateway for meals-gemini-recipe-generator Lambda"

  # Define CORS configuration directly on the API
  # This allows API Gateway to automatically handle OPTIONS preflight requests
  cors_configuration {
    allow_origins = ["https://meals.stellation.one"] # Allow requests from your specific frontend origin
    allow_methods = ["POST", "OPTIONS"]             # Allow POST and the preflight OPTIONS requests
    allow_headers = ["Content-Type", "Authorization"] # Specify allowed headers (adjust if your frontend sends others)
    max_age       = 300                             # Cache preflight response for 5 minutes (optional)
    # allow_credentials = false # Default is false, usually not needed unless sending cookies/auth headers that require it
  }

  tags = var.project_tags
}

# --- API Gateway Integration ---
# Connects the API Gateway to the Lambda function

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.gemini_api.id
  integration_type = "AWS_PROXY" # Standard integration type for Lambda proxy
  integration_uri  = aws_lambda_function.gemini_generator.invoke_arn # ARN for invoking the Lambda
  payload_format_version = "2.0" # Default is 2.0 for HTTP APIs, usually correct
}

# --- API Gateway Route ---
# Defines the specific path and method that triggers the integration

resource "aws_apigatewayv2_route" "post_route" {
  api_id    = aws_apigatewayv2_api.gemini_api.id
  route_key = "POST /generate-recipe" # Route for POST requests to /generate-recipe
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# --- API Gateway Stage ---
# Creates a deployment stage (e.g., 'prod') for the API

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id = aws_apigatewayv2_api.gemini_api.id
  name   = "$default" # Use the special $default stage for automatic deployment

  # Enable automatic deployment whenever the API configuration changes
  auto_deploy = true

  # Optional: Configure logging, throttling for the stage
  # access_log_settings { ... }
  # default_route_settings { ... }

  tags = var.project_tags
}

# --- Lambda Permission ---
# Grants API Gateway permission to invoke the Lambda function

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.gemini_generator.function_name
  principal     = "apigateway.amazonaws.com"

  # Source ARN restricts permission specifically to this API Gateway API
  # Format: arn:aws:execute-api:region:account-id:api-id/stage/verb/resource-path
  source_arn = "${aws_apigatewayv2_api.gemini_api.execution_arn}/*/*"
  # The first * is for any stage, the second * is for any method/path on this API
}

# --- Output the API Endpoint URL ---
# Makes it easy to find the URL after deployment

output "api_endpoint_url" {
  description = "The invocation URL for the API Gateway stage"
  value       = aws_apigatewayv2_stage.default_stage.invoke_url
}