
# Register
echo "Registering user..."
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"testuser_$(Get-Date -Format 'yyyyMMddHHmmss')\", \"email\": \"test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com\", \"password\": \"password123\", \"role\": \"customer\", \"securityQuestion\": \"q\", \"securityAnswer\": \"a\"}"

# Login (using fixed credentials for simplicity in this script, but in reality we'd need to capture the random ones or use a fixed one if we clean up DB)
# Let's just use a fixed user for the script to be re-runnable if we handle errors, but for now I'll just use a unique one each time.
# Actually, I'll just run the curl commands directly in the terminal one by one to capture output better.
