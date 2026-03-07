# Remote backend — run scripts/bootstrap.sh ONCE before terraform init
# Replace <ACCOUNT_ID> with your AWS account ID after running bootstrap.sh
terraform {
  backend "s3" {
    # bucket         = "liquidflow-terraform-state-<ACCOUNT_ID>"
    # Recomendation use terraform init -backend-config="bucket=liquidflow-terraform-state-${AWS_ACCOUNT_ID}" in cli to avoid hardcoding the bucket name
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "liquidflow-terraform-locks"
  }
}
