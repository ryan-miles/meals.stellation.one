data "aws_s3_bucket" "website" {
  bucket = "meals.stellation.one"
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = data.aws_s3_bucket.website.id

  index_document {
    suffix = "meals.html"
  }

  error_document {
    key = "meals.html"
  }
}

resource "aws_cloudfront_distribution" "website" {
  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2"  # Changed from "HTTP2" to "http2"
  price_class     = "PriceClass_All"
  aliases         = ["meals.stellation.one"]

  origin {
    domain_name = "${data.aws_s3_bucket.website.id}.s3-website-us-east-1.amazonaws.com"
    origin_id   = "${data.aws_s3_bucket.website.id}.s3-website-us-east-1.amazonaws.com"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
      origin_read_timeout    = 30
      origin_keepalive_timeout = 5
    }
  }

  default_cache_behavior {
    target_origin_id       = "${data.aws_s3_bucket.website.id}.s3-website-us-east-1.amazonaws.com"
    viewer_protocol_policy = "redirect-to-https"
    compress              = true
    cache_policy_id       = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    allowed_methods = ["HEAD", "GET"]
    cached_methods  = ["HEAD", "GET"]
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:243728312407:certificate/1e51f6a3-589c-43e2-b257-7493d7d3368a"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "production"
    Project     = "meals-stellation"
  }
}

# Upload HTML files
resource "aws_s3_object" "html_files" {
  for_each = fileset("${path.module}/files", "*.html")

  bucket       = data.aws_s3_bucket.website.id
  key          = each.value
  source       = "${path.module}/files/${each.value}"
  content_type = "text/html"
  etag         = filemd5("${path.module}/files/${each.value}")
}

# Upload CSS files
resource "aws_s3_object" "css_files" {
  for_each = fileset("${path.module}/files/css", "*.css")

  bucket       = data.aws_s3_bucket.website.id
  key          = "css/${each.value}"
  source       = "${path.module}/files/css/${each.value}"
  content_type = "text/css"
  etag         = filemd5("${path.module}/files/css/${each.value}")
}

# Upload favicon if exists
resource "aws_s3_object" "favicon" {
  count = fileexists("${path.module}/files/favicon.ico") ? 1 : 0

  bucket       = data.aws_s3_bucket.website.id
  key          = "favicon.ico"
  source       = "${path.module}/files/favicon.ico"
  content_type = "image/x-icon"
  etag         = filemd5("${path.module}/files/favicon.ico")
}

# Upload JavaScript files
resource "aws_s3_object" "js_files" {
  for_each = fileset("${path.module}/files/js", "*.js")

  bucket       = data.aws_s3_bucket.website.id
  key          = "js/${each.value}"
  source       = "${path.module}/files/js/${each.value}"
  content_type = "application/javascript"
  etag         = filemd5("${path.module}/files/js/${each.value}")
}

# Upload Recipe JSON files
resource "aws_s3_object" "recipe_files" {
  for_each = fileset("${path.module}/files/recipes", "*.json")

  bucket       = data.aws_s3_bucket.website.id
  key          = "recipes/${each.value}"
  source       = "${path.module}/files/recipes/${each.value}"
  content_type = "application/json"
  etag         = filemd5("${path.module}/files/recipes/${each.value}")
}

# Upload root JSON files
resource "aws_s3_object" "json_files" {
  for_each = toset([
    "all-recipes.json",
    "schedule.json"
  ])

  bucket       = data.aws_s3_bucket.website.id
  key          = each.value
  source       = "${path.module}/files/${each.value}"
  content_type = "application/json"
  etag         = filemd5("${path.module}/files/${each.value}")
}

# Upload image files
resource "aws_s3_object" "image_files" {
  for_each = fileset("${path.module}/files/images", "*")

  bucket       = data.aws_s3_bucket.website.id
  key          = "images/${each.value}"
  source       = "${path.module}/files/images/${each.value}"
  content_type = "image/png"
  etag         = filemd5("${path.module}/files/images/${each.value}")
}

# Get Lambda and API Gateway info
data "aws_lambda_function" "recipe_ai" {
  function_name = "recipe-ai-function"
}

data "aws_apigatewayv2_api" "recipe_ai" {
  api_id = "h2nljkpm48"
}

# Create a config file with the values
resource "aws_s3_object" "config" {
  bucket       = data.aws_s3_bucket.website.id
  key          = "js/config.js"
  content_type = "application/javascript"
  content      = <<EOF
const API_CONFIG = {
  gateway_id: "${data.aws_apigatewayv2_api.recipe_ai.api_id}",
  lambda_name: "${data.aws_lambda_function.recipe_ai.function_name}",
  api_endpoint: "https://${data.aws_apigatewayv2_api.recipe_ai.api_id}.execute-api.us-east-1.amazonaws.com/prod/recipe-ai"
};
EOF
}

