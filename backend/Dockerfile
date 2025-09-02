# Use an official Python runtime as a parent image
FROM python

# Install curl
RUN apt-get update && apt-get install -y curl

# Set the working directory in the container
WORKDIR /code

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY ./app /code/app

# Command to run the application as a module
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]