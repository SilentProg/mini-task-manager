// CI-пайплайн Mini Task Manager: встановлення залежностей, лінтер, unit-тести, збірка React-клієнта.
// Працює як на Windows-агенті (bat), так і на Linux/macOS (sh). Потрібен Node.js 20+ у PATH агента.
// Docker-стадії (ДЗ1): збірка образу на Linux-агенті з Docker, push у Docker Hub і розгортання - за параметрами.

def runCmd(String command) {
    if (isUnix()) {
        sh command
    } else {
        bat command
    }
}

pipeline {
    agent any

    parameters {
        booleanParam(name: 'PUSH_IMAGE', defaultValue: false,
            description: 'Завантажити образ у Docker Hub (потрібні credentials з id dockerhub)')
        booleanParam(name: 'DEPLOY', defaultValue: false,
            description: 'Оновити запущений стек у DEPLOY_DIR без простою (scripts/rolling-update.sh)')
    }

    environment {
        IMAGE = 'silentprog/mini-task-manager'
        DEPLOY_DIR = '/opt/mini-task-manager'
    }

    triggers {
        // Запуск збірки вебхуком GitHub (Settings → Webhooks → <jenkins>/github-webhook/)
        githubPush()
    }

    options {
        skipDefaultCheckout()
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                runCmd('node --version')
                runCmd('npm --version')
                runCmd('npm ci')
            }
        }

        stage('Lint') {
            steps {
                runCmd('npm run lint')
            }
        }

        stage('Unit tests') {
            steps {
                runCmd('npm run test:ci')
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                }
            }
        }

        stage('Build client') {
            steps {
                runCmd('npm run build')
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'client/dist/**', fingerprint: true
            }
        }

        stage('Docker build') {
            when { expression { isUnix() } }
            steps {
                sh 'docker build --build-arg APP_VERSION=${BUILD_NUMBER} -t ${IMAGE}:${BUILD_NUMBER} -t ${IMAGE}:latest .'
                sh 'docker image ls ${IMAGE}'
            }
        }

        stage('Docker push') {
            when { expression { isUnix() && params.PUSH_IMAGE } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_TOKEN')]) {
                    sh 'echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin'
                    sh 'docker push ${IMAGE}:${BUILD_NUMBER}'
                    sh 'docker push ${IMAGE}:latest'
                }
            }
            post {
                always {
                    sh 'docker logout || true'
                }
            }
        }

        stage('Deploy') {
            when { expression { isUnix() && params.DEPLOY } }
            steps {
                sh 'cd ${DEPLOY_DIR} && git pull --ff-only && ./scripts/rolling-update.sh ${BUILD_NUMBER}'
            }
        }
    }

    post {
        success {
            echo 'Збірка успішна: лінтер і тести пройдено, клієнт зібрано.'
        }
        failure {
            echo 'Збірка впала. Перевірте лог стадії, що завершилась помилкою.'
        }
    }
}
