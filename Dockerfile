# Use a lighter version of Node as a parent image
FROM node:12.16.1-alpine3.11

WORKDIR /server/

# copy package.json into the container at /server
COPY package.json yarn.lock /server/

# install dependencies
RUN yarn install

EXPOSE ${PORT}

# Run the app when the container launches
CMD [ "yarn", "live" ]
