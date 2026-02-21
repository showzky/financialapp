param(
    [string]$Message = "chore: snapshot commit - update workspace"
)
git add -A
git commit -m $Message
git push origin main
