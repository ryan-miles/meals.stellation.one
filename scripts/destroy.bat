@echo off
echo WARNING: This will destroy resources.
set /p CONTINUE=Are you sure you want to continue? (y/n): 
if /i "%CONTINUE%" == "y" (
  echo Running Terraform Destroy...
  terraform destroy -auto-approve
) else (
  echo Destroy cancelled.
)
