# surprisePlan/terraform/variables.tf

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "function_name" {
  description = "Name for the Lambda function"
  type        = string
  default     = "surprise-plan-lambda" # UPDATED: Default name
}

variable "api_name" {
  description = "Name for the API Gateway HTTP API"
  type        = string
  default     = "surprise-plan-api" # UPDATED: Default name
}

# ADDED: S3 Configuration Variables
variable "s3_bucket_name" {
  description = "Name of the S3 bucket containing website files (recipes, schedule)"
  type        = string
  default     = "meals.stellation.one" # Set the default value
}

variable "s3_recipes_prefix" {
  description = "S3 prefix where recipe JSON files are stored (e.g., 'json/recipes/')"
  type        = string
  default     = "json/recipes/" # UPDATED: Corrected prefix based on screenshot
}

variable "s3_schedule_key" {
  description = "S3 key for the schedule.json file (e.g., 'website/schedule.json')"
  type        = string
  default     = "website/schedule.json" # Sensible default
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "nodejs20.x" # Keep Node.js 20.x
}

variable "lambda_handler" {
  description = "Lambda function handler"
  type        = string
  default     = "index.handler"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30 # Consider reducing this (e.g., 10 or 15)
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 128 # Likely sufficient
}

variable "project_tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project = "MealsStellationOne"
    Service = "SurprisePlanAPI" # UPDATED: Service tag
  }
}

// ... other variable blocks ...