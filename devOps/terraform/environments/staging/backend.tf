terraform {
  backend "s3" {
    bucket         = "liquidflow-terraform-state-<ACCOUNT_ID>"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "liquidflow-terraform-locks"
  }
}
