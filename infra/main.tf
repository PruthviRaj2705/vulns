# INTENTIONALLY INSECURE - SAST test only
provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

resource "aws_s3_bucket" "data" {
  bucket = "vuln-lab-data"
  acl    = "public-read"
}

resource "aws_security_group" "open" {
  name = "open-sg"
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "db" {
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  username            = "admin"
  password            = "admin123"
  publicly_accessible = true
  storage_encrypted   = false
  skip_final_snapshot = true
}
