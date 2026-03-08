const testLogin = async () => {
    try {
        console.log("Attempting fetch to http://127.0.0.1:5000/api/auth/login");
        const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: "customer@example.com", password: "password123" })
        });
        
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", data);
    } catch (err) {
        console.error("Fetch Error:", err);
    }
};

testLogin();
