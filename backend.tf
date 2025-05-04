terraform {
  backend "s3" {
    bucket = "meals-stellation-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"  // Change this to your AWS region if different
  }
}
