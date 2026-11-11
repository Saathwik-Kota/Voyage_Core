pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        SONAR_HOST_URL = 'http://sonarqube:9000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Identity Manager') {
                    steps {
                        dir('services/identity-manager') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Profile Service') {
                    steps {
                        dir('services/profile-service') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Booking Engine') {
                    steps {
                        dir('services/booking-engine') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Transaction Service') {
                    steps {
                        dir('services/transaction-service') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('API Gateway') {
                    steps {
                        dir('services/api-gateway') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Identity Manager Tests') {
                    steps {
                        dir('services/identity-manager') {
                            sh 'npm test'
                        }
                    }
                }
                stage('Profile Service Tests') {
                    steps {
                        dir('services/profile-service') {
                            sh 'npm test'
                        }
                    }
                }
                stage('Booking Engine Tests') {
                    steps {
                        dir('services/booking-engine') {
                            sh 'npm test'
                        }
                    }
                }
                stage('Transaction Service Tests') {
                    steps {
                        dir('services/transaction-service') {
                            sh 'npm test'
                        }
                    }
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'
                    withSonarQubeEnv('SonarQube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Identity Manager Image') {
                    steps {
                        dir('services/identity-manager') {
                            sh 'docker build -t voyage-identity-manager:${BUILD_NUMBER} .'
                        }
                    }
                }
                stage('Profile Service Image') {
                    steps {
                        dir('services/profile-service') {
                            sh 'docker build -t voyage-profile-service:${BUILD_NUMBER} .'
                        }
                    }
                }
                stage('Booking Engine Image') {
                    steps {
                        dir('services/booking-engine') {
                            sh 'docker build -t voyage-booking-engine:${BUILD_NUMBER} .'
                        }
                    }
                }
                stage('Transaction Service Image') {
                    steps {
                        dir('services/transaction-service') {
                            sh 'docker build -t voyage-transaction-service:${BUILD_NUMBER} .'
                        }
                    }
                }
                stage('API Gateway Image') {
                    steps {
                        dir('services/api-gateway') {
                            sh 'docker build -t voyage-api-gateway:${BUILD_NUMBER} .'
                        }
                    }
                }
                stage('Admin Dashboard Image') {
                    steps {
                        dir('admin-dashboard') {
                            sh 'docker build -t voyage-admin-dashboard:${BUILD_NUMBER} .'
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'ansible-playbook -i ansible/inventory/hosts ansible/deploy.yml'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
