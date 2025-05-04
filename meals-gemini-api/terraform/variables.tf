// filepath: K:\meals.stellation.one\meals-gemini-api\terraform\variables.tf
variable "aws_region" {
  description = "AWS region for deploying resources"
  type        = string
  default     = "us-east-1"
}

variable "function_name" {
  description = "Name for the new Lambda function"
  type        = string
  default     = "meals-gemini-recipe-generator"
}

variable "api_name" {
  description = "Name for the new API Gateway HTTP API"
  type        = string
  default     = "meals-gemini-api"
}

// filepath: K:\meals.stellation.one\meals-gemini-api\terraform\variables.tf
variable "gemini_secret_name" {
  description = "Name (or ARN) of the secret in AWS Secrets Manager holding the Gemini API key"
  type        = string
  default     = "meals-gemini-api-key" # Updated based on screenshot
}

variable "lambda_runtime" {
  description = "Node.js runtime for the Lambda function"
  type        = string
  default     = "nodejs18.x" # Or nodejs20.x if preferred
}

variable "lambda_handler" {
  description = "Handler function within the Lambda code"
  type        = string
  default     = "index.handler" # Assumes ESM export named 'handler' in index.js
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30 # Adjust as needed for Gemini API calls
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 256 # Adjust based on testing, 128 might be too low with dependencies
}

variable "project_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "meals-stellation"
    Service     = "gemini-api"
    ManagedBy   = "Terraform"
  }
}

// ... other variable blocks ...