variable "aws_region" {
  description = "The AWS region to create resources in"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
}

variable "gemini_api_key_secret" {
  description = "Name or ARN of the secret for the gemini API key"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "meals"
}