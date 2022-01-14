import { getInput } from "@actions/core";

async function main() {
  const AWS_ID = getInput("aws_access_id");
  const AWS_KEY = getInput("aws_access_key");
  const S3_PATH = getInput("s3_bucket_path");

  
}
