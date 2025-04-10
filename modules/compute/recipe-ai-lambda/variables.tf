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
  description = "Name of the AWS Secrets Manager secret containing the Gemini API key"
  type        = string
  default     = "/meals-stellation/gemini-api-key"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "meals" # You can change this default value as needed
}