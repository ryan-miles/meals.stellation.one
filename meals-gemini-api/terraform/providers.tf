terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"

  # Configure backend to use the S3 bucket for state management
  backend "s3" {
    bucket         = "meals-stellation-terraform-state" # Your bucket name
    key            = "meals-gemini-api/terraform.tfstate" # Path within the bucket for this project's state
    region         = "us-east-1" # Assuming your bucket is in us-east-1
    encrypt        = true
    # dynamodb_table = "your-terraform-lock-table" # Optional: Add if you have a DynamoDB table for locking
  }
}

provider "aws" {
  region = var.aws_region
}