pipeline {
    agent any

    environment {
        APP_NAME = "splitkuy"
        IMAGE_NAME = "${env.DOCKER_HUB_USER}/${APP_NAME}"
        TARGET_NODE = "${env.DEPLOY_TARGET_IP}"
        SSH_CREDS = "jenkins-deploy-ssh"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    def dockerImage = docker.build("${IMAGE_NAME}:latest")
                    docker.withRegistry('', 'docker-hub-creds') {
                        dockerImage.push()
                    }
                }
            }
        }

        stage('Deploy (via SSH)') {
            steps {
                sshagent([SSH_CREDS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no jenkins-deploy@${TARGET_NODE} "
                            docker pull ${IMAGE_NAME}:latest && \
                            docker stop ${APP_NAME} || true && \
                            docker rm ${APP_NAME} || true && \
                            docker run -d \
                                --name ${APP_NAME} \
                                -p 3000:3000 \
                                --restart unless-stopped \
                                ${IMAGE_NAME}:latest && \
                            docker image prune -f
                        "
                    """
                }
            }
        }
    }

    post {
        always {
            sh "docker image prune -f"
        }
        success {
            echo "Successfully deployed to http://${TARGET_NODE}:3000"
        }
    }
}
