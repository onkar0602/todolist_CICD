
pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    environment {
        TARGET_HOST   = '52.207.246.170'
        TARGET_USER   = 'ubuntu'
        DEPLOY_DIR    = '/home/ubuntu/todolist'
        APP_NAME      = 'todolist'
        SSH_CRED      = 'pytho_cicd_key'
        HOST_KEY_FILE = '/var/lib/jenkins/.ssh/known_hosts'
    }

    stages {
        stage('1. Checkout GitHub Code') {
            steps {
                checkout scm

                sh '''
                    set -eu
                    test -f app.py
                    test -f requirements.txt
                    test -f templates/index.html
                    test -d static

                    echo "Application source code verified."
                '''
            }
        }

        stage('2. Validate Python Code') {
            steps {
                sh '''
                    set -eu
                    python3 --version
                    python3 -m py_compile app.py

                    echo "Python syntax validation successful."
                '''
            }
        }

        stage('3. Prepare Verified SSH Host Key') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'target-host-key',
                        variable: 'TARGET_HOST_KEY'
                    )
                ]) {
                    sh '''
                        set -eu

                        mkdir -p "$(dirname "$HOST_KEY_FILE")"
                        chmod 700 "$(dirname "$HOST_KEY_FILE")"

                        # Store the independently verified host key.
                        printf '%s\\n' "$TARGET_HOST_KEY" > "$HOST_KEY_FILE"

                        chmod 600 "$HOST_KEY_FILE"

                        # Confirm the entry is for the expected host.
                        ssh-keygen -F "$TARGET_HOST" \
                          -f "$HOST_KEY_FILE" >/dev/null

                        echo "Verified SSH host key is ready."
                    '''
                }
            }
        }

        stage('4. Verify SSH Connection') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh \
                          -o BatchMode=yes \
                          -o StrictHostKeyChecking=yes \
                          -o UserKnownHostsFile="$HOST_KEY_FILE" \
                          "$TARGET_USER@$TARGET_HOST" \
                          "mkdir -p '$DEPLOY_DIR'"

                        echo "SSH connection successful."
                    '''
                }
            }
        }

        stage('5. Install Python Environment on Target') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh \
                          -o BatchMode=yes \
                          -o StrictHostKeyChecking=yes \
                          -o UserKnownHostsFile="$HOST_KEY_FILE" \
                          "$TARGET_USER@$TARGET_HOST" \
                          'sudo apt-get update &&
                           sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y \
                             python3 python3-pip python3-venv \
                             python3-dev build-essential \
                             nginx rsync curl'

                        echo "Target packages installed."
                    '''
                }
            }
        }

        stage('6. Transfer Application Files') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        rsync -az --delete \
                          --exclude='.git/' \
                          --exclude='venv/' \
                          --exclude='.venv/' \
                          --exclude='__pycache__/' \
                          --exclude='.env' \
                          -e "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$HOST_KEY_FILE" \
                          ./ "$TARGET_USER@$TARGET_HOST:$DEPLOY_DIR/"

                        echo "Application files transferred."
                    '''
                }
            }
        }

        stage('7. Install Application Dependencies') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh \
                          -o BatchMode=yes \
                          -o StrictHostKeyChecking=yes \
                          -o UserKnownHostsFile="$HOST_KEY_FILE" \
                          "$TARGET_USER@$TARGET_HOST" \
                          "set -eu;
                           cd '$DEPLOY_DIR';
                           python3 -m venv venv;
                           venv/bin/python -m pip install --upgrade pip;
                           venv/bin/python -m pip install -r requirements.txt;
                           venv/bin/python -m pip install gunicorn;
                           echo 'Dependencies installed successfully.'"
                    '''
                }
            }
        }

        stage('8. Configure Systemd and Nginx') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh \
                          -o BatchMode=yes \
                          -o StrictHostKeyChecking=yes \
                          -o UserKnownHostsFile="$HOST_KEY_FILE" \
                          "$TARGET_USER@$TARGET_HOST" \
                          "sudo bash -s" <<'REMOTE'
set -eu

cat > /etc/systemd/system/todolist.service <<'SERVICE'
[Unit]
Description=Python ToDo List Application
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/todolist
Environment="PATH=/home/ubuntu/todolist/venv/bin"
ExecStart=/home/ubuntu/todolist/venv/bin/gunicorn --workers 2 --bind 127.0.0.1:8000 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

cat > /etc/nginx/sites-available/todolist <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sfn /etc/nginx/sites-available/todolist \
    /etc/nginx/sites-enabled/todolist

rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl daemon-reload
systemctl enable todolist nginx
systemctl restart todolist
systemctl restart nginx

echo "Systemd service and Nginx configured."
REMOTE
                    '''
                }
            }
        }

        stage('9. Application Health Check') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh \
                          -o BatchMode=yes \
                          -o StrictHostKeyChecking=yes \
                          -o UserKnownHostsFile="$HOST_KEY_FILE" \
                          "$TARGET_USER@$TARGET_HOST" \
                          "set -eu;
                           sudo systemctl is-active --quiet todolist;
                           sudo systemctl is-active --quiet nginx;
                           curl --fail --silent --show-error \
                             --retry 5 --retry-delay 2 \
                             http://127.0.0.1:8000/ >/dev/null;
                           curl --fail --silent --show-error \
                             http://127.0.0.1/ >/dev/null;
                           echo 'Health checks passed.'"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: ToDoList deployed successfully.'
            echo 'Website: http://52.207.246.170/'
        }

        failure {
            echo 'FAILED: Check Console Output for the first error.'
        }

        always {
            echo 'ToDoList CI/CD pipeline finished.'
        }
    }
}
