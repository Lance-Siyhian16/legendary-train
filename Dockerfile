#Instruction go here if yo didn't know what to do
FROM node:20-alpine

#Goes to the app directory (think of it like a cd terminal command)
WORKDIR /app

#Copies the package.json and package-lock.json to the app directory
COPY package*.json .

#Installs the dependencies
RUN npm install

#Copies the rest of the code to the app directory
COPY . .

#Sets the port to 3000
ENV PORT=5000

#Exposes the port 3000
EXPOSE 5000

#Runs the app
CMD ["npm", "run", "dev"]

#To build the image (Do it in the terminal command)
#docker build -t herland-laundry-system-backend .

#To run the image
#docker run -p 5000:5000 herland-laundry-system
