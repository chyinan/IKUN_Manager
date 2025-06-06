/**
 * 登录
 */
login(loginData: LoginData) {
  return new Promise<void>((resolve, reject) => {
    loginApi(loginData)
      .then(async (response) => {
        // 1. Set the token from the login response
        const { token } = response.data;
        setToken(token);
        this.token = token;

        try {
          // 2. Await the getInfo call to fetch complete user data
          const { data: userInfo } = await this.getInfo();
          console.log('[User Store] Fetched complete user info after login:', userInfo);
          
          // 3. Critically, populate the store's state with the complete data
          if (userInfo) {
            this.username = userInfo.username;
            this.avatar = userInfo.avatar;
            this.roles = [userInfo.role]; // Assuming role is a single string
            this.perms = []; // Reset perms or populate if available
            this.userInfo = userInfo; // Store the whole object if needed elsewhere
          } else {
             throw new Error("getInfo() did not return user information.");
          }

          // 4. Only resolve after the state is fully populated
          resolve();
        } catch (error) {
          console.error('[User Store] Failed to fetch or process user info after login:', error);
          // Clear token and state on failure to ensure a clean slate
          this.logout(); 
          reject(error);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
},

/**
 * 获取信息
 */
getInfo() {
  // Implementation of getInfo method
},

// ... existing code ... 