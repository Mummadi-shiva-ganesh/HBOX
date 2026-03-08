import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  bool _isLoading = true;
  List<dynamic> _kids = [];
  List<dynamic> _orders = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final kidsRes = await ApiService.get('/kids');
      final ordersRes = await ApiService.get('/orders');
      
      if (mounted) {
        setState(() {
          _kids = jsonDecode(kidsRes.body);
          _orders = jsonDecode(ordersRes.body);
          _isLoading = false;
        });
      }
    } catch (e) {
      print("Error fetching customer data: \$e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('HBOX', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -1)),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, color: Colors.black),
            onPressed: () => context.read<AuthProvider>().logout(),
          ),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Colors.black))
        : RefreshIndicator(
            onRefresh: _fetchData,
            color: Colors.black,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.blue[100],
                        radius: 28,
                        child: Text(
                          user?.name.substring(0, 1).toUpperCase() ?? 'U',
                          style: TextStyle(color: Colors.blue[800], fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Good Morning,', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text(user?.name ?? 'User', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  const Text('Active Deliveries', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  
                  if (_orders.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.grey[200]!, style: BorderStyle.none),
                      ),
                      child: const Center(
                        child: Column(
                          children: [
                            Icon(LucideIcons.packageSearch, size: 48, color: Colors.grey),
                            SizedBox(height: 16),
                            Text('No active orders today', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._orders.map((order) => _buildOrderCard(order)),
                    
                  const SizedBox(height: 32),
                  const Text('Registered Kids', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 16),
                  
                  ..._kids.map((kid) => _buildKidCard(kid)),
                ],
              ),
            ),
          ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.black,
        onPressed: () {
          // Open Add Kid Screen
        },
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: const Text('Add Kid', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    Color statusColor = Colors.orange;
    if (order['status'] == 'Delivered') statusColor = Colors.green;
    if (order['status'] == 'Out for Delivery') statusColor = Colors.blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.grey.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  order['status'].toUpperCase(),
                  style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
              ),
              if (order['status'] == 'Out for Delivery')
                const Icon(LucideIcons.navigation, color: Colors.blue, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          Text(order['kid_name'], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(LucideIcons.school, size: 14, color: Colors.grey),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  order['school_name'],
                  style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKidCard(Map<String, dynamic> kid) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(16)),
            child: const Icon(LucideIcons.baby, color: Colors.blue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(kid['kid_name'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                Text(kid['school_name'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
