export interface User {
  id: string;
  repositories: string[];
}

export interface Match {
  giverId: string;
  receiverId: string;
  repositoryUrl: string;
}

export class RandomMatcher {
  match(users: User[], seed: number): Match[] {
    if (users.length === 0) return [];
    if (users.length === 1) return [];

    const shuffled = this.shuffle([...users], seed);
    const matches: Match[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length];

      if (receiver.repositories.length === 0) continue;

      const repoIndex = this.seededRandom(seed + i) % receiver.repositories.length;
      matches.push({
        giverId: giver.id,
        receiverId: receiver.id,
        repositoryUrl: receiver.repositories[repoIndex],
      });
    }

    return matches;
  }

  private shuffle<T>(array: T[], seed: number): T[] {
    const arr = [...array];
    let currentSeed = seed;

    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.seededRandom(currentSeed++) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * 1000000);
  }
}
