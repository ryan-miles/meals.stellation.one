output "function_name" {
  description = "Name of the Lambda function"
  value = data.aws_lambda_function.recipe_ai.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function"
  value = data.aws_lambda_function.recipe_ai.arn
}

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value = "https://${data.aws_apigatewayv2_api.existing.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/prod/recipe-ai"
}

# Add this data source for region information
data "aws_region" "current" {}