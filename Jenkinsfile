def createVersion() {
    // image:commid(7)-timestamp(12)-BUILD_ID
    // image:7230193-202401311614-22
    return new Date().format('yyyyMMddHHmmss') + "-${env.BUILD_ID}"
}

pipeline {
  agent any
  environment {
    commitId = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
    _version = createVersion()
  }
  stages {
     stage ('Clone repository') {
        steps {
          checkout scm
        }
    }
    stage('Build') {
      steps {
        sh '''
        yarn run prepare:docker
        docker build -t myregistry.dataleapinfo.com:5443/dbgate:latest -t myregistry.dataleapinfo.com:5443/dbgate:${commitId}-${_version} ./docker/Dockerfile-alpine
        echo builded.
        '''
      }
    }
    stage('Push image to myregistry'){
      steps{
        script{
          sh '''docker push myregistry.dataleapinfo.com:5443/dbgate:latest
                docker push myregistry.dataleapinfo.com:5443/dbgater:${commitId}-${_version}
                docker rmi myregistry.dataleapinfo.com:5443/dbgate:latest
                docker rmi myregistry.dataleapinfo.com:5443/dbgate:${commitId}-${_version}
              '''
        }
      }
    }
    stage('Deploy') {
      steps {
        sshagent(['manager']) {
          sh '''
            ssh root@172.30.246.29 /usr/bin/docker service update --image myregistry.dataleapinfo.com:5443/dbgate:${commitId}-${_version} dbgate
            '''
        }
      }
    }
  }
  post {
    always {
      echo 'One way or another, I have finished'
      deleteDir()
    }
    success {
        echo 'I succeeeded!'
        mail to: 'haorui215@126.com',
            subject: "Succeeded Pipeline: ${currentBuild.fullDisplayName}",
            body: "Build is succeeded with ${env.BUILD_URL}"
    }
    failure {
        echo 'I failed :('
        mail to: 'haorui215@126.com',
            subject: "Failed Pipeline: ${currentBuild.fullDisplayName}",
            body: "Something is wrong with ${env.BUILD_URL}"
    }
  }
}
