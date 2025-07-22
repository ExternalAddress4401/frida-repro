import Java from "frida-java-bridge";

Java.perform(() => {
	var Log = Java.use("android.util.Log");
	Log.v("test", "hello from eval");
})