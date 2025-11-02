# CORS Error Troubleshooting Guide

## Error Message
```
Access to fetch at 'http://localhost:5002/api/auth/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Common Causes & Solutions

### 1. Backend Server Not Running
**Check:** Run the server check script
```bash
node check-server.js
```

**Solution:** Start the backend server
```bash
npm start
```

### 2. Backend Server Crashed
**Symptoms:** 
- Server was working, then stopped
- CORS errors appear after a few minutes

**Solution:** 
1. Check the backend terminal for error messages
2. Restart the server: `npm start`
3. Check MongoDB is running

### 3. Port Conflict
**Check:** Make sure nothing else is using port 5002
```bash
# Windows
netstat -ano | findstr :5002

# Linux/Mac
lsof -i :5002
```

**Solution:** Kill the conflicting process or change the port in `.env`

### 4. MongoDB Connection Issues
**Symptoms:**
- Server starts but crashes after a few seconds
- "MongoDB connection error" in logs

**Solution:**
1. Make sure MongoDB is installed and running
2. Check MongoDB connection string in `.env` or server.js
3. Default: `mongodb://localhost:27017/corruptionless-building`

### 5. Frontend Making Requests Too Early
**Solution:** The frontend should wait for the backend to be ready

### 6. Browser Cache Issues
**Solution:**
1. Clear browser cache
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Try incognito/private mode

## Quick Fix Steps

1. **Check if backend is running:**
   ```bash
   node check-server.js
   ```

2. **If not running, start it:**
   ```bash
   npm start
   ```

3. **Check MongoDB:**
   - Windows: Check Services for "MongoDB"
   - Linux/Mac: `sudo systemctl status mongod`

4. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Start backend: `npm start`
   - Start frontend: `npm start`

5. **Clear browser cache and refresh**

## Prevention

To prevent the server from crashing:

1. **Use nodemon for auto-restart:**
   ```bash
   npm install -g nodemon
   nodemon server.js
   ```

2. **Monitor server logs** for errors

3. **Ensure MongoDB is always running** before starting the backend

4. **Check system resources** - make sure you have enough RAM/CPU

## Still Having Issues?

Run the diagnostic script:
```bash
node check-server.js
```

Check the backend terminal for error messages and look for:
- MongoDB connection errors
- Port binding errors
- Unhandled promise rejections
- Memory issues