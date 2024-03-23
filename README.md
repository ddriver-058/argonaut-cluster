## Argonaut Cluster
Argonaut Cluster enables you to control VMs declaratively and effortlessly across a physical cluster. 

**NOTE: This is a beta release of a personal project. It is only recommended for development and test cases.**

 - Simple configuration through a single **argonaut_cluster.yaml** that abstracts the setup of Vagrant and Ansible to manage VMs on multiple physical nodes.
 - Streamlined cluster management through a Vue 3 web interface. Sync your configuration, edit & preview, and snapshot your cluster with the click of a button.
 - Easily add new services for your VMs and Argonaut Cluster controller to access via Docker Compose.
 - Extend your cluster management by running custom Ansible playbooks via the web interface.

Argonaut Cluster aims to provide a simple but flexible solution for those looking to control VMs across a home lab or server farm.

 - Scale your virtualized Kubernetes cluster to multiple physical nodes.
 - Deploy development boxes for a group of users from a central configuration.
 - Recreate complex networks without worrying about per-node limitations.
 - Test isolated CI/CD environments with more flexibility.

## Disclaimers

 - As stated, this is a beta release of a personal project, so I can only recommend development or test use cases. So far, I have only tested this on an Ubuntu Server Argonaut Cluster host and Ubuntu Server Vagrant hosts. Please feel free to reach out about your experience on other systems (see the prerequisites).
 - This project extends the use of Vagrant in an unconventional way. It is built on the idea that, while Vagrant is intended for development, the underlying VM providers are broader in scope, so Vagrant can profitably be used as an abstraction layer over the provider.
 - Be sure to use Vagrant >= 1.7 so that the default insecure SSH key is swapped out on 'vagrant up', and that SSH connections are only accepted on 127.0.0.1. This avoids the main insecurities of default Vagrant boxes.
 - Be mindful that the docker-compose.yaml will contain sensitive information, so make sure its permissions are set to disable unauthorized reading.
 - This project has no official affiliation with HashiCorp Vagrant, the Argonaut JSON parser, Ansible, or the Argo Project.


## Prerequisites
To get started with Argonaut Cluster:

 1. Ensure your Argonaut Cluster host is on a compatible system. Any system that can run Docker AND is capable of SSH agent forwarding should work. Windows does not appear to be able to agent forward as of the time of writing (however, you may have success mounting the whole SSH folder. I'm planning to test this during the beta release). 
 2. Docker is installed on your Argonaut Cluster host.
 3. Vagrant and the VirtualBox provider are installed on your VM hosts. (Note: VirtualBox is currently the only tested provider.)
 4. You have passwordless SSH from your Argonaut Cluster host to each of your Vagrant hosts.

## Gaining passwordless SSH

    ssh-keygen -t rsa # If you don't already have a private key. Press enter through each prompt, don't set a passphrase
    ssh-copy-id username@remote_server # Repeat for each remote_server
    ssh username@remote_server # Repeat for each, accepting the host keys to update known_hosts


## Quickstart
Clone this repository and ensure that your known_hosts file is located in ~/.ssh/known_hosts. If not, update the docker-compose.yaml with your actual known_hosts file location.

Also, update the AC_USERNAME and AC_PASSWORD environment variables in the docker-compose.yaml with the values you want to use to log into Argonaut Cluster.

Then, navigate to the repository dir and run:

    source startArgonautCluster.sh
Finally, go to 

    https://[your-argonaut-cluster-host-name]:7443
accept the self-signed cert and log in.
## Editing argonaut_cluster.yaml
Argonaut Cluster provides a built-in editor (thanks to vue-codemirror) accessible by clicking the pencil in the bottom toolbar of the UI. Reference the comprehensive example and populate the file with values relevant to your use case. 

You can render the templated Vagrantfiles and Ansible Inventory using the right-hand dropdown.  When you are satisfied, click save.

Then, you can use the toolbar icons to interact with your cluster. 

If your configuration works to your liking and you want to keep it, you **must** copy the argonaut_cluster.yaml from the editor to your local repository, otherwise, your configuration will be lost with the lifecycle of the container.
## Editing docker_compose.yaml
You can view the docker_compose.yaml to learn about the environment variables that can be passed to the api: service.

You are also able to add new services if you want your VMs to make use of them. For instance, here is a simple TFTP service due to [pghalliday](https://github.com/pghalliday-docker/tftp).

    api: {}
      # your api service definition here
    tftp:
      image: pghalliday/tftp
      container_name: tftp
      ports:
        - "69:69/udp"
      volumes:
        - "$HOME/tftp:/var/tftpboot"
    
Then, your Argonaut Cluster container and the VMs can access the TFTP server via:

    tftp [argonaut-cluster-host-name]
   
 For an example, check out argonaut_cluster_k3s_cluster.yaml.

## Adding custom playbooks
To add custom playbooks, create a new folder in api/playbooks, then save a playbook.yaml to it. E.g.,

    api/playbooks/my-playbook/playbook.yaml
Restart Argonaut Cluster and you should find your new playbook. Note that, currently, no variables are passed to the playbook, so you may need to define variables in the playbook or make use of inventory groups to achieve your goal.

## How it works
Argonaut Cluster runs an API server implemented in node.js with Koa. It runs Ansible playbooks within the API container and streams the output in real time to the Vue 3 app via WebSocket connections. The API server passes in variables for the pre-bundled playbooks via temporary files.

The app collects information about the cluster by parsing logs from playbooks and SSH processes. It only persists authentication information -- all other information is initialized and pulled again on refresh.

The API server uses Handlebars to template out Vagrantfiles and Ansible inventories from the argonaut_cluster.yaml. When the configuration is synced, it pastes the updated Vagrantfiles into the Vagrant servers. When the API server is started, and when a new configuration is saved, it updates the Ansible inventory (/etc/ansible/hosts).

The app uses nginx to secure https / wss communication from the user's browser.
