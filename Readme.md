
# ToDo List Application Deployment on AWS Using Jenkins CI/CD

## Project Overview

This project demonstrates the automated deployment of a Python Flask ToDo List web application on AWS EC2 using GitHub, Jenkins, SSH, Gunicorn, and Nginx.

Whenever a developer pushes code to GitHub, a webhook triggers Jenkins. Jenkins automatically retrieves the latest code, validates the application, connects to the target EC2 server through SSH, deploys the application, and verifies its status.

## Architecture Diagram

```text
Developer (VS Code)
        |
        | Git Push
        v
GitHub Repository
        |
        | GitHub Webhook
        v
Jenkins Master - AWS EC2
        |
        | Jenkins Pipeline
        | 1. Checkout Code
        | 2. Validate Python
        | 3. Verify SSH
        | 4. Transfer Files
        | 5. Install Dependencies
        | 6. Configure Services
        v
Target Server - AWS EC2
        |
        | Python Flask Application
        | Gunicorn - Port 8000
        | Nginx - Port 80
        v
User Web Browser
```

## Technologies Used

- AWS EC2
- Git and GitHub
- GitHub Webhooks
- Jenkins Pipeline
- Python 3
- Flask
- HTML5
- CSS3
- JavaScript
- Linux (Ubuntu)
- SSH
- Python Virtual Environment
- Gunicorn
- Nginx
- systemd

## Project Features

- Python Flask-based ToDo List application.
- Web-based user interface using HTML, CSS, and JavaScript.
- GitHub integration for source code management.
- Automatic Jenkins pipeline execution after a GitHub push.
- Secure SSH connection between Jenkins and the target EC2 instance.
- Automated application file transfer.
- Automated Python dependency installation.
- Gunicorn configuration to run the Flask application.
- Nginx reverse proxy configuration.
- systemd service management.
- Automated deployment health checks.

## Project Directory Structure

```text
todolist_CICD/
├── app.py
├── requirements.txt
├── Jenkinsfile
├── .gitignore
├── README.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## AWS Infrastructure

This project uses two AWS EC2 instances.

| EC2 Instance | Purpose |
|---|---|
| Jenkins Master | Runs Jenkins and executes the CI/CD pipeline |
| Target EC2 | Hosts the Python ToDo List application |

## CI/CD Pipeline Workflow

### Step 1: Code Development

Develop the application using Visual Studio Code.

![ToDo List Application Architecture](/image/vs.png)

### Step 2: Push Code to GitHub

Push application changes to the GitHub repository.

```bash
git add .
git commit -m "Update ToDo List application"
git push origin main
```

### Step 3: GitHub Webhook

GitHub sends a webhook notification to Jenkins when new code is pushed.
![ToDo List Application Architecture](/image/webhook.png)

### Step 4: Jenkins Pipeline

Jenkins automatically executes the pipeline defined in the `Jenkinsfile`.

The pipeline checks out the source code and validates the application files and Python syntax.
![ToDo List Application Architecture](/image/pi.png)
![ToDo List Application Architecture](/image/pe.png)

### Step 5: SSH Connection

Jenkins establishes a secure SSH connection to the target EC2 instance using a configured SSH credential and a verified host key.

### Step 6: Application Deployment

Jenkins transfers application files to the target server and installs the required Python packages.

### Step 7: Configure Gunicorn and Nginx

Gunicorn runs the Flask application on `127.0.0.1:8000`.

Nginx listens on port 80 and forwards incoming HTTP requests to Gunicorn.
### Step 8: Credential
![ToDo List Application Architecture](/image/credential.png)
### Step 9: Health Check

Jenkins verifies that the application and Nginx services are running and that the application responds to HTTP requests.
### Step 9: Output
![ToDo List Application Architecture](/image/output.png)
## Prerequisites

- An AWS account.
- Two Ubuntu EC2 instances.
- Jenkins installed on the Jenkins Master instance.
- Python 3 and Git.
- A GitHub repository.
- Jenkins Pipeline and SSH Agent plugins.
- A configured Jenkins SSH private-key credential.
- A verified SSH host key for the target server.
- Correct EC2 security group rules.

## Required Network Ports

| Port | Service | Recommended Access |
|---|---|---|
| 22 | SSH | Trusted IPs or Jenkins server |
| 80 | Nginx HTTP | Public access if the website should be public |
| 8080 | Jenkins | Trusted IPs only |
| 8000 | Gunicorn | Localhost only |

Never expose private SSH keys, passwords, or application secrets in your GitHub repository.

## Run the Application Locally

Clone the repository:

```bash
git clone https://github.com/onkar0602/todolist_CICD.git
cd todolist_CICD
```

Create a Python virtual environment:

```bash
python3 -m venv venv
```

Activate the virtual environment on Linux:

```bash
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask application:

```bash
python3 app.py
```

Open the local application URL displayed by Flask, typically:

```text
http://127.0.0.1:5000/
```

## Verify the Deployment

Check the application service on the target EC2 instance:

```bash
sudo systemctl status todolist
```

Check Nginx:

```bash
sudo systemctl status nginx
```

Check the Gunicorn application response:

```bash
curl -I http://127.0.0.1:8000/
```

Check the Nginx response:

```bash
curl -I http://127.0.0.1/
```

Access the deployed application from your browser:

```text
http://<TARGET-EC2-PUBLIC-IP>/
```

Replace `<TARGET-EC2-PUBLIC-IP>` with the actual public IP address of your target EC2 instance.

## Learning Outcomes

- AWS EC2 instance management.
- Linux server administration.
- Git and GitHub source code management.
- GitHub webhook configuration.
- Jenkins CI/CD pipeline automation.
- SSH-based remote deployment.
- Python virtual environment management.
- Flask application deployment.
- Gunicorn application serving.
- Nginx reverse proxy configuration.
- systemd service management.
- Automated deployment verification.

## Future Improvements

- Add Docker containerization.
- Integrate Terraform for infrastructure provisioning.
- Add automated testing.
- Configure HTTPS using SSL/TLS.
- Add monitoring and logging.
- Integrate AWS CloudWatch alerts.
- Add a database for persistent task storage if not already implemented.

## Author

**Onkar Hol**

GitHub: [onkar0602](https://github.com/onkar0602)

Project Repository: [todolist_CICD](https://github.com/onkar0602/todolist_CICD)

---

**Project:** Python ToDo List Application Deployment on AWS using GitHub Webhooks and Jenkins CI/CD.


