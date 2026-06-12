# Manual de Instalação e Deploy na VPS

Este guia explica como configurar a infraestrutura necessária na sua VPS (Ubuntu/Debian) para rodar o **ispDown**.

## 1. Montando o Segundo Disco para Uploads

Como os arquivos de transferência são muito grandes, é crucial que eles não sejam armazenados no disco principal do sistema operacional (OS) para evitar que o servidor trave.

1. **Identifique o disco secundário**:
   Execute o comando `lsblk` para listar os discos. O disco secundário geralmente aparece como `/dev/sdb` ou `/dev/vdb`.

   ```bash
   lsblk
   ```

2. **Formate o disco (se for novo)**:
   > **CUIDADO:** Isso apagará todos os dados de `/dev/sdb`. Substitua `sdb` pelo nome correto do seu disco.
   
   ```bash
   sudo mkfs.ext4 /dev/sdb
   ```

3. **Crie a pasta padrão de uploads**:
   Esta é a pasta que o nosso sistema usará no Host da VPS.
   
   ```bash
   sudo mkdir -p /var/isp-transfer/uploads
   ```

4. **Monte o disco na pasta**:
   ```bash
   sudo mount /dev/sdb /var/isp-transfer/uploads
   ```

5. **(Opcional) Torne a montagem permanente**:
   Para que o disco monte automaticamente caso o servidor reinicie, adicione a entrada no `/etc/fstab`.
   
   ```bash
   echo '/dev/sdb /var/isp-transfer/uploads ext4 defaults 0 0' | sudo tee -a /etc/fstab
   ```

## 2. Instalando o Docker e Subindo a Aplicação

1. **Instale o Docker e o Docker Compose**:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   ```

2. **Copie os arquivos do projeto para a VPS**:
   Transfira a pasta `ispDown` para a sua VPS (usando `scp` ou clonando via git).

3. **Inicie o sistema**:
   Dentro da pasta `ispDown`, rode o seguinte comando:
   
   ```bash
   sudo docker-compose up -d --build
   ```

O sistema subirá o Banco de Dados, o Backend e o Frontend. 
- O Frontend ficará acessível na porta `80` (http://seu-ip).
- O Backend ficará acessível na porta `8080`.
- Os arquivos enviados pelos usuários serão gravados fisicamente em `/var/isp-transfer/uploads`, garantindo que o seu disco OS fique livre.
