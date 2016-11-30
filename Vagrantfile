Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :private_network, ip: "192.168.22.75"
  config.vm.provider "virtualbox" do |v|
        v.memory = 2048
        v.cpus = 1
  end
  config.vm.provision "shell", path: "./provision.sh"
  #config.vm.synced_folder "./browser", "/usr/local/src/page_thinner/browser", owner: "vagrant", group: "vagrant"
end
