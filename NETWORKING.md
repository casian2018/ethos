# How to Configure LiveKit for Local Network Access

To allow devices on your local network (like your MacBook) to connect to the LiveKit server running on your PC, you need to configure LiveKit to listen on all network interfaces, not just `localhost`.

## 1. `livekit.yaml` Configuration

The `livekit.yaml` file is the primary configuration file for the LiveKit server. To make it accessible from your local network, you need to set `bind_addresses` to `0.0.0.0`.

Here is the configuration we created in `docker/livekit.yaml`:

```yaml
port: 7880
bind_addresses:
  - 0.0.0.0 # This is the crucial line
rtc:
  tcp_port: 7881
  udp_port: 7882
  port_range_start: 50000
  port_range_end: 60000
keys:
    devkey: secret
logging:
  level: info
  pion_level: info
```

By setting `bind_addresses` to `0.0.0.0`, you are telling the LiveKit server to accept connections on all available network interfaces on the host machine.

## 2. Docker Compose Port Mapping

In the `docker-compose.yaml` file, we map the ports from the container to the host machine. This makes the LiveKit server accessible from the outside.

```yaml
services:
  livekit:
    # ...
    ports:
      - "7880:7880"       # WebRTC
      - "7881:7881"       # HTTP
      - "50000-60000:50000-60000/udp" # UDP
    # ...
```

This configuration ensures that any traffic coming to these ports on your PC will be forwarded to the LiveKit container.

## 3. Finding Your PC's Local IP Address

To connect from your MacBook, you will need the local IP address of your PC. You can find this by opening a terminal or command prompt on your PC and running one of the following commands:

*   **Windows:** `ipconfig` (Look for the "IPv4 Address" under your active network adapter)
*   **macOS/Linux:** `ifconfig` or `ip addr` (Look for the `inet` address)

Let's say your PC's local IP address is `192.168.1.100`.

## 4. Connecting from the Frontend

In your frontend application (running on the MacBook), you need to use your PC's local IP address to connect to the LiveKit server.

You would typically configure this in an environment variable. For example, in the `frontend/.env.local` file:

```
NEXT_PUBLIC_LIVEKIT_URL=ws://192.168.1.100:7880
```

By using your PC's local IP address, your MacBook can find and connect to the LiveKit server running in Docker on your PC.

## 5. Firewall Configuration

If you are still unable to connect, it's possible that a firewall on your PC is blocking the connection. You may need to create rules to allow incoming traffic on ports 7880, 7881, and the UDP range 50000-60000. The steps to do this depend on your operating system and any firewall software you are using.
