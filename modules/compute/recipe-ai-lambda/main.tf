variable "lambda_bucket_name" {
  description = "Name of S3 bucket for Lambda deployment packages"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "runtime" {
  description = "Runtime for Lambda function"
  type        = string
}

variable "handler" {
  description = "Handler for Lambda function"
  type        = string
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
}

variable "environment_variables" {
  description = "Environment variables for Lambda function"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags for Lambda function"
  type        = map(string)
  default     = {}
}

# Reference existing Lambda function
data "aws_lambda_function" "recipe_ai" {
  function_name = var.function_name
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/function"
  output_path = "${path.module}/function.zip"
  excludes    = [".git", ".gitignore", "test"]  # Don't exclude node_modules
}

data "aws_iam_role" "lambda_exec" {
  name = "recipe-ai-function-exec-role"
}

data "aws_iam_policy" "secrets_access" {
  name = "recipe-ai-function-secrets-access"
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = data.aws_iam_role.lambda_exec.name
  policy_arn = data.aws_iam_policy.secrets_access.arn
}

data "aws_secretsmanager_secret" "openai_api_key" {
  name = "/meals-stellation/openai-api-key"
}

data "aws_secretsmanager_secret" "gemini_api_key" {
  name = var.gemini_api_key_secret
}

# Add CloudWatch Logs permissions
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = data.aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Add basic Lambda execution permissions
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = data.aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Use data source to reference existing API Gateway
data "aws_apigatewayv2_api" "existing" {
  api_id = "h2nljkpm48"
}

resource "aws_apigatewayv2_api" "recipe_ai" {
  name          = "${var.project_name}-recipe-ai-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.recipe_ai.id
  name        = "prod"
  auto_deploy = true
}

# API Gateway Integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = data.aws_apigatewayv2_api.existing.id
  integration_type       = "AWS_PROXY"
  integration_uri        = data.aws_lambda_function.recipe_ai.invoke_arn
  payload_format_version = "2.0"
  description           = "Lambda integration"
}

# POST Route
resource "aws_apigatewayv2_route" "recipe_ai" {
  api_id    = data.aws_apigatewayv2_api.existing.id
  route_key = "POST /recipe-ai"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# OPTIONS Route (CORS)
resource "aws_apigatewayv2_route" "options" {
  api_id    = data.aws_apigatewayv2_api.existing.id
  route_key = "OPTIONS /recipe-ai"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda Permission with unique statement ID
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke-${data.aws_apigatewayv2_api.existing.id}"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.recipe_ai.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_apigatewayv2_api.existing.execution_arn}/*/*"
}