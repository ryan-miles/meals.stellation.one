output "function_name" {
  value = data.aws_lambda_function.recipe_ai.function_name
}

output "function_arn" {
  value = data.aws_lambda_function.recipe_ai.arn
}

output "api_endpoint" {
  value = "${data.aws_apigatewayv2_api.existing.api_endpoint}/prod/recipe-ai"
}