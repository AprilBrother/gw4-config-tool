### How To Run ###

* Install `pnpm` and libraries
```
pnpm i
```
* Run command
```
pnpm start
```

### How To Package ###

* Install electron-builder
```
pnpm add -D electron-builder
```
* 打包windows版本
```
electron-builder -w
```
* 在dist目录下有安装包生成

### Credits

This soft uses the following open source components:

* [posix_tz_db](https://github.com/nayarsystems/posix_tz_db) POSIX timezones strings
