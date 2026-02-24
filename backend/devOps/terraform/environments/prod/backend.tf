terraform {
  backend "s3" {
    bucket         = "liquidflow-terraform-state-<ACCOUNT_ID>"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "liquidflow-terraform-locks"
  }
}
