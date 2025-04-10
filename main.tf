# Root module for meals.stellation.one infrastructure

terraform {
  required_version = ">= 1.0.0"
}

provider "aws" {
  region = var.aws_region
}

// ...existing code...

# Example of how to use modules
# module "networking" {
#   source = "./modules/networking"
#   # Input variables
# }

# module "storage" {
#   source = "./modules/storage"
#   # Input variables
# }

module "recipe_ai_lambda" {
  source = "./modules/compute/recipe-ai-lambda"

  aws_account_id     = "461699465450"  # Your AWS account ID
  environment        = "production"
  lambda_bucket_name = "meals-stellation-lambda-functions"
  function_name      = "recipe-ai-function"
  runtime           = "nodejs18.x"
  handler           = "index.handler"
  timeout          = 30

  environment_variables = {
    OPENAI_API_KEY_SECRET = "/meals-stellation/openai-api-key"
    GEMINI_API_KEY_SECRET = "/meals-stellation/gemini-api-key"
  }

  tags = {
    Project     = "meals-stellation"
    Environment = "production"
  }
}

module "website" {
  source = "./modules/storage/website"
}
