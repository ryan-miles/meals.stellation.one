# Terraform Infrastructure for meals.stellation.one

This directory contains Terraform configurations to deploy the meals.stellation.one application to AWS.

## Structure

- \nvironments/\ - Environment-specific configurations (dev, staging, prod)
- \modules/\ - Reusable infrastructure components
- \scripts/\ - Helper scripts for Windows

## Getting Started

1. Navigate to the environment you want to deploy: \cd environments/dev\
2. Initialize Terraform: \	erraform init\
3. Plan your deployment: \	erraform plan\
4. Apply the changes: \	erraform apply\

## Module Documentation

- \
etworking/\ - VPC, subnets, and security groups
- \compute/\ - EC2 instances and load balancers
- \database/\ - RDS or DynamoDB resources
- \storage/\ - S3 buckets for static content
- \cicd/\ - CI/CD pipeline configuration
