#!/bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 -d DockerUsername -v CommitSHA -s server -p password"
   echo -e "\t-d DockerHub Username"
   echo -e "\t-v First 8 Characters of Commit SHA"
   echo -e "\t-s SSH Destination: user@server"
   echo -e "\t-p Password to ssh (make sure sshpass is installed)"
   exit 1 # Exit script after printing help
}

while getopts "a:b:c:" opt
do
   case "$opt" in
      v ) CommitSHA="$OPTARG" ;;
      s ) server="$OPTARG" ;;
      p ) password="$OPTARG" ;;
      d ) DockerUsername="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

# Print helpFunction in case parameters are empty
if [ -z "$CommitSHA" ] || [ -z "$server" ] || [ -z "$password" ] || [ -z "$DockerUsername" ]
then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

# Begin script in case all parameters are correct
echo "$DockerUsername"
echo "$CommitSHA"
echo "$server"
echo "$password"

sshpass -p "$password" ssh $server "mkdir -p ~/isec-backend";
sshpass -p "$password" ssh $server "cd ~/isec-backend && docker-compose down";
sshpass -p "$password" scp docker-compose-production.yml $server:~/isec-backend/docker-compose.yml;
sshpass -p "$password" scp .env.example $server:~/isec-backend/.env.example;
sshpass -p "$password" ssh $server "mkdir -p ~/isec-backend/db";
sshpass -p "$password" scp ./db/init.js $server:~/isec-backend/db/init.js;
sshpass -p "$password" ssh $server "cd ~/isec-backend && DOCKER_HUB_USERNAME=$DockerUsername CI_COMMIT_SHORT_SHA=$CommitSHA docker-compose up -d";
sshpass -p "$password" ssh $server 'DOCKER_HUB_USERNAME='"$DockerUsername"'; for diru in $(docker images $DOCKER_HUB_USERNAME*/* --format "{{.Repository}}" | sort | uniq); do for dimr in $(docker images --format "{{.ID}};{{.Repository}}:{{.Tag}};{{.CreatedAt}}" --filter=reference="$diru:*" | sed -r "s/\s+/~/g" | tail -n+4); do img_tag=$(echo "$dimr" | cut -d";" -f2); docker rmi "$img_tag"; done done'
