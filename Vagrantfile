Vagrant.require_version ">= 2.3.4"

# ** Author Information ** #

#####################################################################################################
# Name:  Ali Umar                                                                                    
# Date:  2023-01-07                                                                                  
# Email: ali.umar.work@gmail.com                                                                     
#####################################################################################################

# ** Programmer Set Enviornment Specific Values #

#####################################################################################################

$name = "ali"
$static_ip = "10.0.0.1"
$port = 7001
#####################################################################################################

Vagrant.configure("2") do |config|
  config.vm.box      = "ubuntu/jammy64"
  config.vm.hostname = "vm0-dev"
  config.vm.synced_folder ".", "/vagrant/"

  config.vm.network "forwarded_port", guest: 80, host: $port 
  config.vm.network "private_network", ip: $static_ip

  config.vm.provision "ansible_local" do |ansible|
    ansible.limit = "all"
    ansible.verbose  = "v"
    ansible.playbook = "development_playbook.yml"
    ansible.provisioning_path = "/vagrant/ansible" 
    ansible.inventory_path = "/vagrant/ansible/inventory.ini"
    ansible.config_file = "/vagrant/ansible/ansible.cfg"
  end
end
