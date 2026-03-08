import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = true;

  User? get user => _user;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _initUser();
  }

  Future<void> _initUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        _user = User.fromJson(jsonDecode(userStr));
      }
    } catch (e) {
      print("Error loading user: $e");
      await logout();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final res = await ApiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setString('user', jsonEncode(data['user']));
        _user = User.fromJson(data['user']);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print("Login error: $e");
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> userData) async {
    try {
      final res = await ApiService.post('/auth/register', userData);
      if (res.statusCode == 201) {
        return await login(userData['email'], userData['password']);
      }
      return false;
    } catch (e) {
      print("Register error: $e");
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    _user = null;
    notifyListeners();
  }
}
