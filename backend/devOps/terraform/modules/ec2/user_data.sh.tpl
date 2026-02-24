#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# LiquidFlow — EC2 Bootstrap Script
# Environment : ${environment}
# Project     : ${project_name}
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "======================================================="
echo " LiquidFlow Bootstrap — ${environment}"
echo " $(date -u)"
echo "======================================================="

# System Update
dnf update -y
dnf install -y git curl unzip jq

# Node.js 20 (LTS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
node --version
npm --version

# Application User (created early so pm2 startup can reference it)
useradd -m -s /bin/bash appuser || true
mkdir -p /home/appuser/app/logs

# PM2 Process Manager
npm install -g pm2
pm2 startup systemd -u appuser --hp /home/appuser

# AWS CLI v2
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install --update
rm -rf /tmp/awscliv2.zip /tmp/aws/
aws --version

# CloudWatch Agent
dnf install -y amazon-cloudwatch-agent

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWCONFIG'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "metrics": {
    "namespace": "LiquidFlow/${environment}",
    "append_dimensions": {
      "AutoScalingGroupName": "$${aws:AutoScalingGroupName}",
      "InstanceId": "$${aws:InstanceId}"
    },
    "metrics_collected": {
      "mem": { "measurement": ["mem_used_percent"] },
      "disk": { "measurement": ["disk_used_percent"], "resources": ["/"] },
      "cpu": { "measurement": ["cpu_usage_active"], "totalcpu": true }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/appuser/app/logs/app.log",
            "log_group_name": "/liquidflow/${environment}/app",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30
          },
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/liquidflow/${environment}/user-data",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 7
          }
        ]
      }
    }
  }
}
CWCONFIG

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Fetch DB Credentials from Secrets Manager
echo "Fetching DB credentials from Secrets Manager..."
DB_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "${db_secret_arn}" \
  --region "${aws_region}" \
  --query SecretString \
  --output text)

DB_PASSWORD=$(echo "$DB_SECRET" | jq -r '.password')
DB_USERNAME=$(echo "$DB_SECRET" | jq -r '.username')

# Application Environment File
cat > /home/appuser/app/.env << ENV
NODE_ENV=${environment}
PORT=${app_port}
DATABASE_URL=postgresql://$${DB_USERNAME}:$${DB_PASSWORD}@${db_endpoint}:${db_port}/${db_name}
AWS_REGION=${aws_region}
ENV

chown -R appuser:appuser /home/appuser/app
chmod 600 /home/appuser/app/.env

echo "======================================================="
echo " Bootstrap complete — $(date -u)"
echo "======================================================="
