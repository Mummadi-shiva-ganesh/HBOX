import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:url_launcher/url_launcher.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class RiderScreen extends StatefulWidget {
  const RiderScreen({super.key});

  @override
  State<RiderScreen> createState() => _RiderScreenState();
}

class _RiderScreenState extends State<RiderScreen> {
  bool _isLoading = true;
  List<dynamic> _deliveries = [];
  Position? _currentPosition;
  IO.Socket? _socket;
  final String _socketUrl = 'http://10.0.2.2:5000'; // Match backend

  @override
  void initState() {
    super.initState();
    _initRiderServices();
  }

  Future<void> _initRiderServices() async {
    await _fetchDeliveries();
    await _initLocationAndSocket();
  }

  Future<void> _fetchDeliveries() async {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    try {
      final res = await ApiService.get('/orders?role=rider&userId=\${user?.id}');
      if (mounted) {
        setState(() {
          _deliveries = jsonDecode(res.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      print("Error fetching deliveries: \$e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _initLocationAndSocket() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    
    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      _currentPosition = await Geolocator.getCurrentPosition();
      
      _socket = IO.io(_socketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
      });
      _socket?.connect();

      Geolocator.getPositionStream(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 10)
      ).listen((Position position) {
        _currentPosition = position;
        
        // Emit location if out for delivery
        final outForDelivery = _deliveries.where((d) => d['status'] == 'Out for Delivery').toList();
        final user = Provider.of<AuthProvider>(context, listen: false).user;
        
        for (var delivery in outForDelivery) {
          _socket?.emit('update_location', {
            'orderId': delivery['id'],
            'riderId': user?.id,
            'lat': position.latitude,
            'lng': position.longitude,
            'destLat': delivery['school_lat'],
            'destLng': delivery['school_lng'],
            'timestamp': DateTime.now().toIso8601String(),
          });
        }
      });
    }
  }

  Future<void> _updateStatus(int orderId, String status) async {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    try {
      final body = {'status': status};
      if (status == 'Accepted') body['rider_id'] = user?.id;
      
      await ApiService.put('/orders/\$orderId', body);
      _socket?.emit('update_status', {'orderId': orderId, 'status': status});
      _fetchDeliveries();
    } catch (e) {
      print("Update status error: \$e");
    }
  }

  Future<void> _openGoogleMaps(dynamic delivery) async {
    final String destination = Uri.encodeComponent("\${delivery['school_name']}, \${delivery['school_address']}");
    final Uri url = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=\$destination&travelmode=driving");
    
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  void dispose() {
    _socket?.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark mode for rider
      appBar: AppBar(
        title: const Text('HBOX Pilot', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        backgroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.user, color: Colors.grey),
            onPressed: () {}, // Profile
          ),
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: Colors.grey),
            onPressed: () => context.read<AuthProvider>().logout(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsGrid(),
                  const SizedBox(height: 32),
                  if (_deliveries.isEmpty)
                    _buildEmptyState()
                  else
                    ..._deliveries.map((d) => _buildDeliveryCard(d)),
                ],
              ),
            ),
    );
  }

  Widget _buildStatsGrid() {
    final deliveredCount = _deliveries.where((d) => d['status'] == 'Delivered').length;
    final earnings = deliveredCount * 40;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStat('Deliveries', '\${_deliveries.length}', Colors.white),
          Container(width: 1, height: 40, color: Colors.white.withOpacity(0.1)),
          _buildStat('Earnings', '₹\$earnings', Colors.blue[400]!),
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(label.toUpperCase(), style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white.withOpacity(0.1), style: BorderStyle.none),
      ),
      child: const Column(
        children: [
          Icon(LucideIcons.package, size: 48, color: Colors.grey),
          SizedBox(height: 16),
          Text('No school orders available', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildDeliveryCard(Map<String, dynamic> delivery) {
    final status = delivery['status'];
    final isDelivered = status == 'Delivered';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                    child: const Icon(LucideIcons.package, color: Colors.blue),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(delivery['kid_name'], style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 2),
                      Text(delivery['school_name'].toUpperCase(), style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ],
                  ),
                ],
              ),
              if (isDelivered) const Icon(LucideIcons.checkCircle, color: Colors.green),
            ],
          ),
          const SizedBox(height: 24),
          
          if (!isDelivered) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16)),
              child: Row(
                children: [
                  const Icon(LucideIcons.mapPin, color: Colors.grey, size: 16),
                  const SizedBox(width: 12),
                  Expanded(child: Text(delivery['school_address'], style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold))),
                ],
              ),
            ),
            const SizedBox(height: 16),
            
            if (status == 'Packed')
              _buildActionButton('Accept Request', Colors.blue[600]!, Colors.white, () => _updateStatus(delivery['id'], 'Accepted')),
              
            if (status == 'Accepted')
              _buildActionButton('Mark as Picked Up', Colors.white, Colors.black, () => _updateStatus(delivery['id'], 'Picked Up')),
              
            if (status == 'Picked Up') ...[
              _buildActionButton('Start Delivery', Colors.blue[600]!, Colors.white, () => _updateStatus(delivery['id'], 'Out for Delivery'), icon: LucideIcons.navigation),
              const SizedBox(height: 12),
              _buildActionButton('Open Google Maps', Colors.white.withOpacity(0.1), Colors.white, () => _openGoogleMaps(delivery)),
            ],
            
            if (status == 'Out for Delivery') ...[
              _buildActionButton('Navigate with Google Maps', Colors.white.withOpacity(0.1), Colors.white, () => _openGoogleMaps(delivery)),
              const SizedBox(height: 12),
              _buildActionButton('Confirm Delivery', Colors.green, Colors.white, () => _updateStatus(delivery['id'], 'Delivered')),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, Color bgColor, Color textColor, VoidCallback onTap, {IconData? icon}) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: textColor,
          padding: const EdgeInsets.symmetric(vertical: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
            Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }
}
