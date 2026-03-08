import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/customer/home_screen.dart';
import 'screens/rider/rider_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const LunchBoxApp(),
    ),
  );
}

class LunchBoxApp extends StatelessWidget {
  const LunchBoxApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HBOX',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Inter',
        scaffoldBackgroundColor: Colors.white,
        colorScheme: const ColorScheme.light(
          primary: Colors.black,
          secondary: Colors.blue,
        ),
      ),
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isLoading) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator(color: Colors.black)),
            );
          }
          if (auth.user == null) {
            return const LoginScreen();
          }
          
          if (auth.user!.role == 'rider') {
            return const RiderScreen();
          }
          
          return const CustomerHomeScreen();
        },
      ),
    );
  }
}
