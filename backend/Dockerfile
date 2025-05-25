FROM python:3.11

WORKDIR /app


RUN apt-get update && \
    apt-get install -y git curl unzip gcc python3.11-dev libffi-dev libssl-dev build-essential && \
    curl -sL https://github.com/OWASP/Amass/releases/download/v3.21.2/amass_linux_amd64.zip -o amass.zip && \
    unzip amass.zip && \
    mv amass_linux_amd64/amass /usr/local/bin/ && \
    chmod +x /usr/local/bin/amass && \
    rm -rf amass.zip amass_linux_amd64  && \
    curl -sL https://github.com/projectdiscovery/subfinder/releases/download/v2.6.5/subfinder_2.6.5_linux_amd64.zip -o subfinder.zip&& \
    unzip subfinder.zip && \
    mv subfinder /usr/local/bin/subfinder && \
    chmod +x /usr/local/bin/subfinder && \
    rm -f subfinder.tar.gz


COPY . .


RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install -r base.txt 


COPY ./services/api-keys.yaml ./services/theharvester/api-keys.yaml



WORKDIR /app

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
