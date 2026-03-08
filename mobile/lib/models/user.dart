class User {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? avatar;
  final String? googleId;
  final String? address;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatar,
    this.googleId,
    this.address,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'] ?? 'customer',
      phone: json['phone'],
      avatar: json['avatar'],
      googleId: json['google_id'],
      address: json['address'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'phone': phone,
      'avatar': avatar,
      'google_id': googleId,
      'address': address,
    };
  }
}
