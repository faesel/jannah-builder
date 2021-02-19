[1mdiff --git a/README.md b/README.md[m
[1mindex 1c90a1d..6c8483c 100644[m
[1m--- a/README.md[m
[1m+++ b/README.md[m
[36m@@ -7,4 +7,10 @@[m [mhttps://oblador.github.io/react-native-vector-icons/[m
 [m
 # Async storage docs[m
 [m
[31m-https://react-native-async-storage.github.io/async-storage/docs/api[m
\ No newline at end of file[m
[32m+[m[32mhttps://react-native-async-storage.github.io/async-storage/docs/api[m
[32m+[m
[32m+[m[32m# Choosing colors[m
[32m+[m
[32m+[m[32mhttps://material.io/design/color/dark-theme.html#ui-application[m
[32m+[m[32mhttps://htmlcolorcodes.com/color-picker/[m
[32m+[m[32mhttps://coolors.co/b664e6[m
\ No newline at end of file[m
[1mdiff --git a/constants/Colors.ts b/constants/Colors.ts[m
[1mindex 0613112..ffbd603 100644[m
[1m--- a/constants/Colors.ts[m
[1m+++ b/constants/Colors.ts[m
[36m@@ -59,8 +59,8 @@[m [mexport default {[m
       primary: '#ed4f00',[m
       primaryVariant: '#da0317',[m
       secondary: '#03DAC6',[m
[31m-      background: '#121212',[m
       surface: '#292929',[m
[32m+[m[32m      background: '#121212',[m
       error: '#CF6679',[m
       [m
       onPrimary: '#000000',[m
[1mdiff --git a/screens/SawabTab.tsx b/screens/SawabTab.tsx[m
[1mindex 02919ef..dcb8659 100644[m
[1m--- a/screens/SawabTab.tsx[m
[1m+++ b/screens/SawabTab.tsx[m
[36m@@ -22,7 +22,7 @@[m [mexport default function SawabTab({ navigation }: StackScreenProps<RootStackParam[m
             flexDirection: "column",[m
             display: "flex",[m
             margin: 10,[m
[31m-            borderRadius: 15,[m
[32m+[m[32m            // borderRadius: 15,[m
             padding: 10[m
           }}>[m
 [m
[36m@@ -108,7 +108,7 @@[m [mexport default function SawabTab({ navigation }: StackScreenProps<RootStackParam[m
           flexDirection: "column",[m
           display: "flex",[m
           margin: 10,[m
[31m-          borderRadius: 15,[m
[32m+[m[32m          // borderRadius: 15,s[m
           padding: 10,[m
           marginTop: 0,[m
         }}>[m
[36m@@ -128,8 +128,8 @@[m [mexport default function SawabTab({ navigation }: StackScreenProps<RootStackParam[m
             </Text>[m
 [m
           <View[m
[31m-            lightColor={Colors[colorScheme].primary}[m
[31m-            darkColor={Colors[colorScheme].primary}[m
[32m+[m[32m            lightColor={Colors[colorScheme].secondary}[m
[32m+[m[32m            darkColor={Colors[colorScheme].secondary}[m
             style={{ width: 300, maxHeight: 40, minHeight: 40, marginTop:10 }}[m
           >[m
               <Text[m
[36m@@ -169,8 +169,8 @@[m [mexport default function SawabTab({ navigation }: StackScreenProps<RootStackParam[m
             </Text>[m
 [m
             <View[m
[31m-            lightColor={Colors[colorScheme].primary}[m
[31m-            darkColor={Colors[colorScheme].primary}[m
[32m+[m[32m            lightColor={Colors[colorScheme].secondary}[m
[32m+[m[32m            darkColor={Colors[colorScheme].secondary}[m
             style={{ width: 200, maxHeight: 40, minHeight: 40, marginTop:10 }}[m
           >[m
               <Text[m
