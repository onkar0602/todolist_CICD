
pipeline {
    agent any

   options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
}

    environment {
        // CHANGE THIS IP
        TARGET_HOST = '52.207.246.170'
        TARGET_USER = 'ubuntu'
        DEPLOY_DIR  = '/home/ubuntu/todolist'
        APP_NAME    = 'TOdolist'
        SSH_CRED    = 'pytho_cicd_key'
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

        stage('3. Connect to Target EC2') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu
                        ssh -o BatchMode=yes \
                            -o StrictHostKeyChecking=yes \
                            ${TARGET_USER}@${TARGET_HOST} \
                            "mkdir -p ${DEPLOY_DIR}"

                        echo "SSH connection successful."
                    '''
                }
            }
        }

        stage('4. Install Python Environment on Target') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh -o StrictHostKeyChecking=yes \
                            ${TARGET_USER}@${TARGET_HOST} \
                            'sudo env DEBIAN_FRONTEND=noninteractive apt-get update &&
                             sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y
                               python3 python3-pip python3-venv
                               python3-dev build-essential
                               nginx rsync curl'

                        echo "Python and server packages installed."
                    '''
                }
            }
        }

        stage('5. Transfer Application Files') {
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
                            -e "ssh -o StrictHostKeyChecking=yes" \
                            ./ ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_DIR}/

                        echo "Application files transferred."
                    '''
                }
            }
        }

        stage('6. Create Virtual Environment and Install Packages') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh -o StrictHostKeyChecking=yes \
                            ${TARGET_USER}@${TARGET_HOST} \
                            "set -eu;
                             cd ${DEPLOY_DIR};
                             python3 -m venv venv;
                             venv/bin/python -m pip install --upgrade pip;
                             venv/bin/python -m pip install -r requirements.txt;
                             venv/bin/python -m pip install gunicorn;
                             echo 'Python dependencies installed.'"
                    '''
                }
            }
        }

        stage('7. Configure Application Service and Nginx') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh -o StrictHostKeyChecking=yes \
                            ${TARGET_USER}@${TARGET_HOST} \
                            "sudo env DEPLOY_DIR='${DEPLOY_DIR}' APP_NAME='${APP_NAME}' bash -s" <<'REMOTE'
set -eu

cat > /etc/systemd/system/todolist.service <<EOF
[Unit]
Description=Python ToDo List Application
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=${DEPLOY_DIR}
Environment="PATH=${DEPLOY_DIR}/venv/bin"
ExecStart=${DEPLOY_DIR}/venv/bin/gunicorn --workers 2 --bind 127.0.0.1:8000 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/nginx/sites-available/todolist <<'EOF'
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
EOF

ln -sfn /etc/nginx/sites-available/todolist \
    /etc/nginx/sites-enabled/todolist

nginx -t
systemctl daemon-reload
systemctl enable todolist
systemctl restart todolist
systemctl enable nginx
systemctl restart nginx

echo "Application service and Nginx configured."
REMOTE
                    '''
                }
            }
        }

        stage('8. Application Health Check') {
            steps {
                sshagent(credentials: [env.SSH_CRED]) {
                    sh '''
                        set -eu

                        ssh -o StrictHostKeyChecking=yes \
                            ${TARGET_USER}@${TARGET_HOST} \
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
            echo 'SUCCESS: Python ToDo List deployed and verified.'
            echo 'Open http://YOUR_TARGET_EC2_PUBLIC_IP/'
        }

        failure {
            echo 'FAILED: Check Console Output for the failed stage.'
        }

        always {
            echo 'ToDoList CI/CD pipeline finished.'
        }
    }
}
