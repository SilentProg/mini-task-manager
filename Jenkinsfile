// CI-пайплайн Mini Task Manager: встановлення залежностей, лінтер, unit-тести, збірка React-клієнта.
// Працює як на Windows-агенті (bat), так і на Linux/macOS (sh). Потрібен Node.js 20+ у PATH агента.

def runCmd(String command) {
    if (isUnix()) {
        sh command
    } else {
        bat command
    }
}

pipeline {
    agent any

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
