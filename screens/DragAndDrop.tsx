import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { RootStackParamList } from '../types'
import { useGetPrayer, useSavePrayer, defaultPrayer } from '../hooks/usePrayer'
import { DraxProvider, DraxView, DraxList } from 'react-native-drax'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  link: {
    marginTop: 15,
    paddingVertical: 15
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7'
  },
  draggable: {
    width: 100,
    height: 100,
    backgroundColor: 'blue'
  },
  receiver: {
    width: 100,
    height: 100,
    backgroundColor: 'green'
  },
  alphaItem: {
    backgroundColor: '#aaaaff',
    borderRadius: 8,
    margin: 4,
    padding: 4,
    minWidth: 50,
    width: 50
  },
  alphaText: {
    fontSize: 28
  }
})

export default function Dnd ({
  navigation
}: StackScreenProps<RootStackParamList>) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  const [value, error, isPending] = useGetPrayer(defaultPrayer)
  const [newPrayer, setPrayer] = React.useState(defaultPrayer)

  if (isPending) {
    console.log('LOADING..')
  }

  const [savedValue, saveError, isSaving] = useSavePrayer(newPrayer)
  const [alphaData, setAlphaData] = React.useState(alphabet)

  if (isSaving) {
    console.log('SAVING..')
  }

  const handlePress = () => {
    const random = `test${new Date().toLocaleString()}`
    const prayer = { ...value, title: random }
    setPrayer(prayer)
  }

  return (
    <>
    <View style={styles.container}>
      <Text style={styles.title}>This is the prayer screen.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
        <Text style={styles.linkText}>Back!</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePress} style={styles.link}>
        <Text style={styles.linkText}>Store Value</Text>
      </TouchableOpacity>
      <Text>{ newPrayer !== defaultPrayer ? newPrayer.title : value.title }</Text>
    </View>
    <DraxProvider>
      <View style={styles.container}>
          <DraxView
              style={styles.draggable}
              onDragStart={() => {
                console.log('start drag')
              }}
              payload="world"
          />
          <DraxView
              style={styles.receiver}
              onReceiveDragEnter={({ dragged: { payload } }) => {
                console.log(`hello ${payload}`)
              }}
              onReceiveDragExit={({ dragged: { payload } }) => {
                console.log(`goodbye ${payload}`)
              }}
              onReceiveDragDrop={({ dragged: { payload } }) => {
                console.log(`received ${payload}`)
              }}
          />
      </View>
      </DraxProvider>
      <DraxProvider>
        <View style={styles.container}>
          <DraxList
            style={{ display: 'flex', flexDirection: 'row' }}
            data={alphaData}
            renderItemContent={({ item }) => (
              <View style={styles.alphaItem}>
                <Text style={styles.alphaText}>{item}</Text>
              </View>
            )}
            onItemReorder={({ fromIndex, toIndex }) => {
              const newData = alphaData.slice()
              newData.splice(toIndex, 0, newData.splice(fromIndex, 1)[0])
              setAlphaData(newData)
            }}
            numColumns={5}
            keyExtractor={(item) => item}
          />
        </View>
    </DraxProvider>
    </>
  )
}
